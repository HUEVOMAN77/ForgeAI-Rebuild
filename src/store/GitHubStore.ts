import {makeAutoObservable, runInAction} from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {makePersistable} from 'mobx-persist-store';
import * as Keychain from 'react-native-keychain';
import * as RNFS from '@dr.pogodin/react-native-fs';

import {
  createGitHubFile,
  getGitHubUser,
  listGitHubRepositories,
  type GitHubRepository,
  type GitHubUser,
} from '../services/github/GitHubService';

const GITHUB_TOKEN_SERVICE = 'forgeai_github_token';

class GitHubStore {
  private token: string | null = null;
  user: GitHubUser | null = null;
  repositories: GitHubRepository[] = [];
  selectedRepositoryFullName: string | null = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: 'GitHubStore',
      properties: ['selectedRepositoryFullName'],
      storage: AsyncStorage,
    });
    this.loadTokenFromSecureStorage();
  }

  private async loadTokenFromSecureStorage() {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: GITHUB_TOKEN_SERVICE,
      });
      if (!credentials) return;
      const user = await getGitHubUser(credentials.password);
      runInAction(() => {
        this.token = credentials.password;
        this.user = user;
      });
    } catch {
      // A revoked or expired token is kept out of memory and can be replaced in Ajustes.
      runInAction(() => {
        this.token = null;
        this.user = null;
      });
    }
  }

  get isConnected() {
    return !!this.token && !!this.user;
  }

  get selectedRepository() {
    return this.repositories.find(
      repository => repository.full_name === this.selectedRepositoryFullName,
    );
  }

  async connect(token: string): Promise<boolean> {
    this.isLoading = true;
    this.error = null;
    try {
      const user = await getGitHubUser(token);
      await Keychain.setGenericPassword('github_token', token, {
        service: GITHUB_TOKEN_SERVICE,
      });
      runInAction(() => {
        this.token = token;
        this.user = user;
      });
      await this.loadRepositories();
      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'No se pudo conectar con GitHub.';
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async disconnect() {
    await Keychain.resetGenericPassword({service: GITHUB_TOKEN_SERVICE});
    runInAction(() => {
      this.token = null;
      this.user = null;
      this.repositories = [];
      this.selectedRepositoryFullName = null;
      this.error = null;
    });
  }

  async loadRepositories() {
    if (!this.token) throw new Error('Conecta tu cuenta de GitHub primero.');
    this.isLoading = true;
    this.error = null;
    try {
      const repositories = await listGitHubRepositories(this.token);
      runInAction(() => {
        this.repositories = repositories;
        if (
          this.selectedRepositoryFullName &&
          !repositories.some(repo => repo.full_name === this.selectedRepositoryFullName)
        ) {
          this.selectedRepositoryFullName = null;
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'No se pudieron cargar los repositorios.';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  selectRepository(fullName: string) {
    if (!this.repositories.some(repository => repository.full_name === fullName)) {
      throw new Error('El repositorio elegido no está disponible.');
    }
    this.selectedRepositoryFullName = fullName;
  }

  async uploadBackup(filePath: string, filename: string) {
    if (!this.token || !this.selectedRepositoryFullName) {
      throw new Error('Conecta GitHub y selecciona un repositorio antes de subir un respaldo.');
    }
    this.isLoading = true;
    this.error = null;
    try {
      const base64Content = await RNFS.readFile(filePath, 'base64');
      const result = await createGitHubFile({
        token: this.token,
        repository: this.selectedRepositoryFullName,
        path: `forgeai-backups/${filename}`,
        base64Content,
        message: `Respaldo de ForgeAI: ${filename}`,
      });
      return result.commit.sha;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'No se pudo subir el respaldo.';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }
}

export const githubStore = new GitHubStore();
