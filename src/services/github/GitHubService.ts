const API_BASE = 'https://api.github.com';
// GitHub's currently supported REST API version. A future, unsupported date
// can make valid personal access tokens appear to fail authentication.
const API_VERSION = '2022-11-28';

export interface GitHubUser {
  login: string;
  avatar_url?: string;
}

export interface GitHubRepository {
  id: number;
  full_name: string;
  private: boolean;
  default_branch: string;
  updated_at: string;
}

interface GitHubApiError {
  message?: string;
}

const headers = (token: string) => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': API_VERSION,
});

const explainGitHubError = (
  status: number,
  detail?: string,
): string => {
  if (status === 401) {
    return 'GitHub rechazó el token. Revísalo, confirma que no haya expirado y vuelve a intentarlo.';
  }
  if (status === 403) {
    return 'GitHub denegó el acceso. En un token de granularidad fina, habilita el repositorio y el permiso Contents para leer y escribir.';
  }
  if (status === 404) {
    return 'GitHub no encontró el recurso. Verifica que el token tenga acceso al repositorio seleccionado.';
  }
  if (status === 422) {
    return 'GitHub rechazó la solicitud. Verifica el repositorio, el nombre del archivo y los permisos del token.';
  }
  return detail || `GitHub respondió con el estado ${status}.`;
};

const request = async <T>(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {...headers(token), ...(options.headers ?? {})},
  });
  const raw = await response.text();
  let body: unknown;
  try {
    body = raw ? JSON.parse(raw) : undefined;
  } catch {
    body = undefined;
  }
  if (!response.ok) {
    const detail = (body as GitHubApiError | undefined)?.message;
    throw new Error(explainGitHubError(response.status, detail));
  }
  return body as T;
};

const validateRepositoryPath = (value: string) => {
  const segments = value.split('/');
  if (!value || segments.some(part => !part || part === '.' || part === '..')) {
    throw new Error('La ruta para GitHub no es válida.');
  }
  return segments.map(encodeURIComponent).join('/');
};

export const getGitHubUser = (token: string) =>
  request<GitHubUser>(token, '/user');

export const listGitHubRepositories = (token: string) =>
  request<GitHubRepository[]>(
    token,
    '/user/repos?affiliation=owner%2Ccollaborator%2Corganization_member&sort=updated&per_page=100',
  );

export const createGitHubFile = async ({
  token,
  repository,
  path,
  base64Content,
  message,
}: {
  token: string;
  repository: string;
  path: string;
  base64Content: string;
  message: string;
}): Promise<{commit: {sha: string}}> => {
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) throw new Error('El repositorio seleccionado no es válido.');
  return request(token, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${validateRepositoryPath(path)}`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message, content: base64Content}),
  });
};
