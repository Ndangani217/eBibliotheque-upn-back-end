// app/constants/faculties.ts
export enum FacultyCode {
    SPA = 'SPA', // Sciences Sociales, Administratives et Politiques
    SEG = 'SEG', // Sciences Économiques et de Gestion
    SAE = 'SAE', // Sciences Agronomiques et Environnement
    PDD = 'PDD', // Pédagogie et Didactique des Disciplines
    LSH = 'LSH', // Lettres et Sciences Humaines
    ST = 'ST', // Sciences et Technologie
    DROIT = 'DROIT', // Droit (Sciences Juridiques)
    SS = 'SS', // Sciences de la Santé
    MV = 'MV', // Médecine Vétérinaire
    PSE = 'PSE', // Psychologie et Sciences de l’Éducation
    ETTS = 'ETTS', // École de Télécommunication et Téléinformatique
}

export const faculties = [
    {
        code: FacultyCode.SPA,
        name: 'Sciences Sociales, Administratives et Politiques',
        departments: [
            'Sciences Politiques',
            'Relations Internationales',
            'Administration Publique',
        ],
    },
    {
        code: FacultyCode.SEG,
        name: 'Sciences Économiques et de Gestion',
        departments: ['Économie', 'Gestion', 'Comptabilité'],
    },
    {
        code: FacultyCode.SAE,
        name: 'Sciences Agronomiques et Environnement',
        departments: ['Agronomie Générale', 'Environnement'],
    },
    {
        code: FacultyCode.PDD,
        name: 'Pédagogie et Didactique des Disciplines',
        departments: ['Pédagogie Générale', 'Didactique'],
    },
    {
        code: FacultyCode.LSH,
        name: 'Lettres et Sciences Humaines',
        departments: ['Littérature', 'Philosophie', 'Histoire', 'Langues'],
    },
    {
        code: FacultyCode.ST,
        name: 'Sciences et Technologie',
        departments: ['Mathématiques', 'Physique', 'Chimie', 'Informatique'],
    },
    {
        code: FacultyCode.DROIT,
        name: 'Droit (Sciences Juridiques)',
        departments: ['Droit Public', 'Droit Privé', 'Droit International'],
    },
    {
        code: FacultyCode.SS,
        name: 'Sciences de la Santé',
        departments: ['Médecine', 'Pharmacie', 'Biologie Médicale'],
    },
    {
        code: FacultyCode.MV,
        name: 'Médecine Vétérinaire',
        departments: ['Clinique Vétérinaire', 'Santé Animale'],
    },
    {
        code: FacultyCode.PSE,
        name: 'Psychologie et Sciences de l’Éducation',
        departments: ['Psychologie', 'Sciences de l’Éducation', 'Orientation Scolaire'],
    },
    {
        code: FacultyCode.ETTS,
        name: 'École de Télécommunication et Téléinformatique',
        departments: ['Télécommunications', 'Réseaux et Téléinformatique', 'Spéciale'],
    },
]
