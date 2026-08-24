import React, {useContext, useState} from 'react';
import {Linking, View} from 'react-native';
import {observer} from 'mobx-react';
import {Button, Snackbar, Text, TextInput as PaperTextInput} from 'react-native-paper';

import {Sheet, TextInput} from '..';
import {EyeIcon, EyeOffIcon} from '../../assets/icons';
import {useTheme} from '../../hooks';
import {githubStore} from '../../store';
import {L10nContext} from '../../utils';
import {createStyles} from '../HFTokenSheet/styles';

interface GitHubTokenSheetProps {
  isVisible: boolean;
  onDismiss: () => void;
  onSave?: () => void;
}

export const GitHubTokenSheet: React.FC<GitHubTokenSheetProps> = observer(
  ({isVisible, onDismiss, onSave}) => {
    const l10n = useContext(L10nContext);
    const theme = useTheme();
    const styles = createStyles(theme);
    const [token, setToken] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [showError, setShowError] = useState(false);

    const save = async () => {
      const connected = await githubStore.connect(token.trim());
      if (connected) {
        setToken('');
        onSave?.();
      } else {
        setShowError(true);
      }
    };

    return (
      <>
        <Sheet isVisible={isVisible} onClose={onDismiss} title={l10n.components.githubTokenSheet.title} snapPoints={['65%']}>
          <Sheet.ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.description}>{l10n.components.githubTokenSheet.description}</Text>
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>{l10n.components.githubTokenSheet.instructions}</Text>
              {l10n.components.githubTokenSheet.instructionsSteps.map((step, index) => (
                <Text key={step} style={styles.instructionItem}>{index + 1}. {step}</Text>
              ))}
              <Text onPress={() => Linking.openURL('https://github.com/settings/personal-access-tokens/new')} style={styles.linkButton}>
                {l10n.components.githubTokenSheet.getTokenLink}
              </Text>
            </View>
            <TextInput
              testID="github-token-input"
              label={l10n.components.githubTokenSheet.inputLabel}
              value={token}
              onChangeText={setToken}
              placeholder={l10n.components.githubTokenSheet.inputPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={secureTextEntry}
              right={<PaperTextInput.Icon icon={({color}) => secureTextEntry ? <EyeIcon width={24} height={24} stroke={color} /> : <EyeOffIcon width={24} height={24} stroke={color} />} onPress={() => setSecureTextEntry(value => !value)} />}
            />
          </Sheet.ScrollView>
          <Sheet.Actions>
            <View style={styles.buttonsContainer}>
              {githubStore.isConnected && <Button mode="text" onPress={() => githubStore.disconnect()} style={styles.resetButton}>{l10n.components.githubTokenSheet.disconnect}</Button>}
              <Button testID="github-token-save-button" mode="contained" onPress={save} loading={githubStore.isLoading} disabled={githubStore.isLoading || !token.trim()} style={styles.saveButton}>{l10n.components.githubTokenSheet.connect}</Button>
            </View>
          </Sheet.Actions>
        </Sheet>
        <Snackbar visible={showError} onDismiss={() => setShowError(false)} duration={4000} style={styles.errorSnackbar}>
          {githubStore.error ?? l10n.components.githubTokenSheet.error}
        </Snackbar>
      </>
    );
  },
);
