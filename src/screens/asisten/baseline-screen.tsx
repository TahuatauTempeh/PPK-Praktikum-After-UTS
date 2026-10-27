import { AssistantHeader } from './components/assistant-header';
import { AssistantScreen } from './components/assistant-screen';

/** Baseline visual saja. Data identitas contoh mengikuti frame Figma 3:12936. */
export default function AssistantBaselineScreen() {
  return (
    <AssistantScreen>
      <AssistantHeader
        greeting="Selamat pagi, Nadia"
        title="Jadwal asisten"
        initials="NA"
        identityLabel="Nadia, asisten (identitas contoh)"
      />
    </AssistantScreen>
  );
}
