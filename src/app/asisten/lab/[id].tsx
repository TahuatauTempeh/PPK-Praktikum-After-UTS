import { router, useLocalSearchParams, type Href } from 'expo-router';

import LabFormScreen from '@/screens/asisten/lab/lab-form-screen';

export default function AssistantLabEditRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const goToList = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/asisten/lab' as Href);
    };

    return <LabFormScreen labId={id} onBack={goToList} onSaved={goToList} />;
}
