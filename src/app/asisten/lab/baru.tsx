import { router, type Href } from 'expo-router';

import LabFormScreen from '@/screens/asisten/lab/lab-form-screen';

export default function AssistantLabCreateRoute() {
    const goToList = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/asisten/lab' as Href);
    };

    return <LabFormScreen onBack={goToList} onSaved={goToList} />;
}