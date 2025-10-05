import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import Env from '#start/env'
import type { MultipartFile } from '@adonisjs/core/bodyparser'

// ✅ Configuration correcte
cloudinary.config({
    cloud_name: Env.get('CLOUDINARY_CLOUD_NAME'),
    api_key: Env.get('CLOUDINARY_API_KEY'),
    api_secret: Env.get('CLOUDINARY_API_SECRET'),
})

console.log('Cloudinary connecté avec :', {
    cloud_name: Env.get('CLOUDINARY_CLOUD_NAME'),
    api_key: Env.get('CLOUDINARY_API_KEY'),
    api_secret: Env.get('CLOUDINARY_API_SECRET') ? '✅ OK' : '❌ ABSENT',
})

export async function uploadToCloudinary(file: MultipartFile, folder = 'uploads') {
    return new Promise<{ status: boolean; url?: string; error?: string }>((resolve) => {
        try {
            if (!file.tmpPath) {
                return resolve({ status: false, error: 'Fichier temporaire introuvable.' })
            }

            console.log('🚀 Upload du fichier vers Cloudinary depuis :', file.tmpPath)

            const uploadStream = cloudinary.uploader.upload_stream(
                { folder, resource_type: 'image' },
                (error, result) => {
                    if (error) {
                        console.error('❌ Erreur Cloudinary :', error)
                        return resolve({ status: false, error: error.message })
                    }
                    console.log('✅ Upload réussi ! URL :', result?.secure_url)
                    resolve({ status: true, url: result?.secure_url })
                },
            )

            fs.createReadStream(file.tmpPath).pipe(uploadStream)
        } catch (error) {
            console.error('⚠️ Exception Cloudinary :', error)
            resolve({ status: false, error: (error as Error).message })
        }
    })
}
