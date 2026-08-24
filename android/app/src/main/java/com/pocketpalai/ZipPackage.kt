package com.pocketpal

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.pocketpal.specs.NativeZipModuleSpec

class ZipPackage : TurboReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == NativeZipModuleSpec.NAME) ZipModule(reactContext) else null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
          NativeZipModuleSpec.NAME to ReactModuleInfo(
              NativeZipModuleSpec.NAME,
              NativeZipModuleSpec.NAME,
              false,
              false,
              true,
              false,
              true
          )
      )
    }
  }
}
