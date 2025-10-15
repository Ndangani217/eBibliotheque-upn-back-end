/** atégories d’abonnés */
export enum SubscriberCategory {
    ETUDIANT = 'etudiant',
    CHERCHEUR = 'chercheur',
}

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
    GESTIONNAIRE = 'gestionnaire',
    GESTIONNAIRE_OBSERVATEUR = 'gestionnaire_observateur',
    ABONNE = 'abonne',
}
