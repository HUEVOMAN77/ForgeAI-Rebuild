// App Check is intentionally omitted from ForgeAI's public/offline build.
// It depends on a private Firebase project configuration and must never prevent
// local chat, ZIP export, or GitHub backup features from launching.
const APP_CHECK_UNAVAILABLE =
  'Firebase App Check is not enabled in this offline build.';

export const initializeAppCheck = async (): Promise<void> => {
  throw new Error(APP_CHECK_UNAVAILABLE);
};

export const getAppCheckToken = async (): Promise<string> => {
  throw new Error(APP_CHECK_UNAVAILABLE);
};
