/** Statut d’un bon de paiement */
export enum VoucherStatus {
    EN_ATTENTE = 'en_attente',
    PAYE = 'paye',
    EXPIRE = 'expire',
    ANNULE = 'annule',
}

/** Statut d’un abonnement */
export enum SubscriptionStatus {
    VALIDE = 'valide',
    EXPIRE = 'expire',
    SUSPENDU = 'suspendu',
}

/** Type de notification */
export enum NotificationType {
    EXPIRATION_PROCHE = 'expiration_proche',
}

/** Canal de notification */
export enum NotificationChannel {
    APP = 'app',
    EMAIL = 'email',
}

/** Rôle utilisateur */
export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    MANAGER_VIEWER = 'manager_viewer',
    SUBSCRIBER = 'subscriber',
}

export enum SubscriberCategory {
    STUDENT = 'student',
    RESEARCHER = 'researcher',
}

export enum SubscriptionDuration {
    THREE_MONTHS = 3,
    SIX_MONTHS = 6,
    NINE_MONTHS = 9,
}
