import {Platform} from 'react-native';

import {format} from 'date-fns';
import * as RNFS from '@dr.pogodin/react-native-fs';
import Share from 'react-native-share';

import NativeZipModule from '../specs/NativeZipModule';
import {chatSessionRepository} from '../repositories/ChatSessionRepository';
import {derivedText, userId} from './chat';

const zipRoot = `${RNFS.CachesDirectoryPath}/forgeai-exports`;

const portableMessage = (message: any) => {
  const inMemory = message.toMessageObject();
  return {
    id: message.id,
    author: message.author,
    text: derivedText(inMemory),
    type: message.type,
    metadata: message.metadata ? JSON.parse(message.metadata) : {},
    createdAt: message.createdAt,
  };
};

export interface ChatBackupFile {
  path: string;
  filename: string;
}

/** Creates a portable JSON backup in app cache without opening the share sheet. */
export const createAllChatSessionsBackupFile = async (): Promise<ChatBackupFile> => {
  await RNFS.mkdir(zipRoot);
  const sessions = await chatSessionRepository.getAllSessions();
  const exportedSessions: Array<Record<string, unknown>> = [];

  for (const session of sessions) {
    const data = await chatSessionRepository.getSessionById(session.id);
    if (!data) continue;
    exportedSessions.push({
      id: data.session.id,
      title: data.session.title,
      date: data.session.date,
      messages: data.messages.map(portableMessage),
      completionSettings: data.completionSettings
        ? JSON.parse(data.completionSettings.settings)
        : {},
      activePalId: data.session.activePalId,
    });
  }

  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const filename = `forgeai_conversaciones_${timestamp}.json`;
  const path = `${zipRoot}/${filename}`;
  await RNFS.writeFile(
    path,
    JSON.stringify(
      {
        format: 'forgeai-chat-backup',
        version: 1,
        exportedAt: new Date().toISOString(),
        messageAuthors: {user: userId, assistant: 'assistant'},
        sessions: exportedSessions,
      },
      null,
      2,
    ),
    'utf8',
  );
  return {path, filename};
};

/** Packages all conversations and a short readme in a portable ZIP then opens Android sharing. */
export const exportAllChatSessionsAsZip = async (): Promise<void> => {
  if (Platform.OS !== 'android' || !NativeZipModule) {
    throw new Error('La exportación ZIP está disponible actualmente en Android.');
  }
  const backup = await createAllChatSessionsBackupFile();
  const readmePath = `${zipRoot}/LEEME.txt`;
  await RNFS.writeFile(
    readmePath,
    'Este archivo contiene un respaldo de conversaciones creado por ForgeAI.\n\n' +
      'El archivo JSON conserva los mensajes y la configuración de cada sesión. ' +
      'No incluye modelos descargados ni credenciales.\n',
    'utf8',
  );
  const zipName = backup.filename.replace(/\.json$/i, '.zip');
  const zipPath = `${zipRoot}/${zipName}`;
  const createdPath = await NativeZipModule.createZip(
    [backup.path, readmePath],
    [backup.filename, 'LEEME.txt'],
    zipPath,
  );
  await Share.open({
    url: `file://${createdPath}`,
    title: 'Exportar respaldo ZIP',
    type: 'application/zip',
    failOnCancel: false,
  });
};
