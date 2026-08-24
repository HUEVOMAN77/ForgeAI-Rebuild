import type {TurboModule} from 'react-native';
import {Platform, TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  createZip(
    sourcePaths: ReadonlyArray<string>,
    entryNames: ReadonlyArray<string>,
    targetPath: string,
  ): Promise<string>;
}

export default Platform.OS === 'android'
  ? TurboModuleRegistry.getEnforcing<Spec>('ZipModule')
  : (null as any as Spec);
