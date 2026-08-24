package com.pocketpal

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.pocketpal.specs.NativeZipModuleSpec
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.util.HashSet
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/**
 * Creates ordinary ZIP files from files prepared in ForgeAI's cache directory.
 * The native boundary rejects path traversal and keeps both source and result
 * inside the app sandbox, so JavaScript cannot use it as a general file reader.
 */
@ReactModule(name = NativeZipModuleSpec.NAME)
class ZipModule(reactContext: ReactApplicationContext) : NativeZipModuleSpec(reactContext) {
  private val appContext = reactContext.applicationContext

  override fun getName(): String = NativeZipModuleSpec.NAME

  override fun createZip(
      sourcePaths: ReadableArray,
      entryNames: ReadableArray,
      targetPath: String,
      promise: Promise
  ) {
    Thread {
      try {
        if (sourcePaths.size() == 0 || sourcePaths.size() != entryNames.size()) {
          throw IllegalArgumentException("La lista de archivos ZIP no es válida.")
        }

        val cacheDirectory = appContext.cacheDir.canonicalFile
        val requestedTarget = File(targetPath).canonicalFile
        if (!isInside(cacheDirectory, requestedTarget)) {
          throw SecurityException("El destino ZIP debe estar dentro de la caché de la aplicación.")
        }
        requestedTarget.parentFile?.let { parent ->
          if (!parent.exists() && !parent.mkdirs()) {
            throw IllegalStateException("No se pudo preparar la carpeta de exportación.")
          }
        }

        val temporary = File(requestedTarget.parentFile, "${requestedTarget.name}.partial")
        if (temporary.exists() && !temporary.delete()) {
          throw IllegalStateException("No se pudo limpiar una exportación anterior incompleta.")
        }

        val seenEntries = HashSet<String>()
        ZipOutputStream(BufferedOutputStream(FileOutputStream(temporary))).use { zip ->
          for (index in 0 until sourcePaths.size()) {
            val sourcePath = sourcePaths.getString(index)
                ?: throw IllegalArgumentException("Falta una ruta de origen.")
            val entryName = entryNames.getString(index)
                ?: throw IllegalArgumentException("Falta un nombre dentro del ZIP.")
            validateEntryName(entryName)
            if (!seenEntries.add(entryName)) {
              throw IllegalArgumentException("El ZIP contiene nombres duplicados.")
            }

            val source = File(sourcePath).canonicalFile
            if (!isInside(cacheDirectory, source) || !source.isFile) {
              throw SecurityException("Solo se pueden exportar archivos temporales creados por ForgeAI.")
            }

            zip.putNextEntry(ZipEntry(entryName))
            BufferedInputStream(FileInputStream(source)).use { input ->
              val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
              while (true) {
                val read = input.read(buffer)
                if (read < 0) break
                zip.write(buffer, 0, read)
              }
            }
            zip.closeEntry()
          }
        }

        if (requestedTarget.exists() && !requestedTarget.delete()) {
          throw IllegalStateException("No se pudo reemplazar la exportación anterior.")
        }
        if (!temporary.renameTo(requestedTarget)) {
          throw IllegalStateException("No se pudo finalizar el archivo ZIP.")
        }
        promise.resolve(requestedTarget.absolutePath)
      } catch (error: Exception) {
        promise.reject("zip_export_failed", error.message, error)
      }
    }.start()
  }

  private fun isInside(parent: File, candidate: File): Boolean {
    val parentPath = parent.path
    return candidate.path == parentPath || candidate.path.startsWith("$parentPath${File.separator}")
  }

  private fun validateEntryName(value: String) {
    if (value.isBlank() || value.startsWith("/") || value.startsWith("\\") || value.contains("..") || value.contains("\\")) {
      throw SecurityException("El nombre dentro del ZIP no es seguro.")
    }
  }
}
