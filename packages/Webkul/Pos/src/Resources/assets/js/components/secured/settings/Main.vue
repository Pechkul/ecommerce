<template>
    <Tab
        :current="tab"
        :tabs="tabs"
        routeBase="/settings"
    />
</template>

<script setup>
    import Profile from '@components/secured/settings/Profile.vue';
    import Sync from '@components/secured/settings/Sync.vue';
    import Shortcuts from '@components/secured/settings/Shortcuts.vue';
    import Regional from '@components/secured/settings/Regional.vue';

    const props = defineProps({
        tab: String
    });

    const tabs = [
        {
            key: 'profile',
            component: Profile,
            titleKey: 'pos.settings.profile.title',
        },
        {
            key: 'sync',
            component: Sync,
            titleKey: 'pos.settings.sync.title',
        },
        {
            key: 'shortcuts',
            component: Shortcuts,
            titleKey: 'pos.settings.shortcuts.title',
        },
        {
            key: 'regional',
            component: Regional,
            titleKey: 'pos.settings.regional.title',
        },
    ];
</script>