<template>
    <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 transform scale-90"
        enter-to-class="opacity-100 transform scale-100"
        leave-active-class="transition ease-in duration-300"
        leave-from-class="opacity-100 transform scale-100"
        leave-to-class="opacity-0 transform scale-90"
    >
        <div
            v-if="isOpen"
            class="fixed inset-0 z-[10003] flex items-center justify-center bg-gray-500 bg-opacity-50 p-4"
            @click.self="close"
        >
            <div
                class="relative flex w-full max-w-[576px] flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 max-h-[90vh] shadow-xl max-sm:w-[96%]"
            >
                <!-- Header -->
                <div class="px-6 pt-6 flex-none">
                    <div class="text-2xl font-semibold text-gray-900 dark:text-white">
                        <slot
                            name="header"
                            :toggle="toggle"
                        />
                    </div>
                </div>

                <!-- Content -->
                <div class="p-6 overflow-y-auto flex-1 flex flex-col">
                    <slot
                        name="content"
                        :toggle="toggle"
                    />
                </div>

                <!-- Footer -->
                <div
                    v-if="$slots.footer"
                    class="p-6 pt-0 flex-none"
                >
                    <slot
                        name="footer"
                        :toggle="toggle"
                    />
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
    import { ref, watch } from 'vue';

    const emit = defineEmits(['close']);

    const isOpen = ref(false);

    const open = () => {
        isOpen.value = true;
    };

    const close = () => {
        isOpen.value = false;
        emit('close');
    };

    const toggle = () => {
        isOpen.value = !isOpen.value;
        if (!isOpen.value) {
            emit('close');
        }
    };

    watch(isOpen, (value) => {
        if (value) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    });

    defineExpose({
        isOpen,
        open,
        close,
        toggle,
    });
</script>
