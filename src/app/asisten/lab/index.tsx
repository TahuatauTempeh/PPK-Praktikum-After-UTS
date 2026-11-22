import { router, type Href } from 'expo-router';

import LabListScreen from '@/screens/asisten/lab/lab-list-screen';

export default function AssistantLabListRoute() {
    return (
        <LabListScreen
            onBack={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/asisten');
            }}
            onAdd={() => router.push('/asisten/lab/baru' as Href)}
            onEdit={labId => router.push(`/asisten/lab/${encodeURIComponent(labId)}` as Href)}
        />
    );
}
