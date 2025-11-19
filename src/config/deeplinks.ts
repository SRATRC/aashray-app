import { DeepLinkType } from '@/src/types/deeplink';

export interface DeeplinkRoute {
    name: DeepLinkType;
    pattern: string; // e.g., '/event/:id'
    target: string;  // e.g., '/event/[id]'
    authRequired: boolean;
}

export const DEEPLINK_ROUTES: DeeplinkRoute[] = [
    {
        name: DeepLinkType.ADHYAYAN_FEEDBACK,
        pattern: '/adhyayan/feedback/:id',
        target: '/adhyayan/feedback/[id]',
        authRequired: true,
    },
    {
        name: DeepLinkType.ADHYAYAN,
        pattern: '/adhyayan/:id',
        target: '/adhyayan/[id]',
        authRequired: true,
    },
    {
        name: DeepLinkType.UTSAV,
        pattern: '/utsav/:id',
        target: '/utsav/[id]',
        authRequired: true,
    },
    {
        name: DeepLinkType.MENU,
        pattern: '/menu',
        target: '/menu',
        authRequired: true,
    },
    {
        name: DeepLinkType.MAINTENANCE,
        pattern: '/maintenanceRequestList',
        target: '/maintenanceRequestList',
        authRequired: false,
    },
    {
        name: DeepLinkType.PENDING_PAYMENT,
        pattern: '/pendingPayments',
        target: '/ppendingPayments',
        authRequired: true,
    },
    {
        name: DeepLinkType.BOOKINGS,
        pattern: '/bookings',
        target: '/bookings',
        authRequired: true,
    },
];
