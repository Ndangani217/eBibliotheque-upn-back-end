export enum SubscriberCategory {
  ETUDIANT = 'étudiant',
  CHERCHEUR = 'chercheur',
}

export enum VoucherStatus {
  EN_ATTENTE = 'en_attente',
  PAYE = 'payé',
  EXPIRE = 'expiré',
  ANNULE = 'annulé',
}

export enum SubscriptionStatus {
  VALIDE = 'valide',
  EXPIRE = 'expiré',
  SUSPENDU = 'suspendu',
}

export enum NotificationType {
  EXPIRATION_PROCHE = 'expiration_proche',
}

export enum NotificationChannel {
  APP = 'app',
}

export enum UserRole {
  ADMIN = 'admin',
  GESTIONNAIRE = 'gestionnaire',
  ABONNE = 'abonne',
  GESTIONNAIRE_OBSERVATEUR = 'gestionnaire_observateur',
}
