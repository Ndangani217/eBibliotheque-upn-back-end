import cloudinary from 'cloudinary'
import Env from '#start/env'
import type { MultipartFile } from '@adonisjs/core/bodyparser'

cloudinary.v2.config({
    cloud_name: Env.get('CLOUDINARY_CLOUD_NAME'),
    api_key: Env.get('CLOUDINARY_API_KEY'),
    api_secret: Env.get('CLOUDINARY_API_SECRET'),
})

export async function uploadToCloudinary(file: MultipartFile, folder = 'uploads') {
    try {
        if (!file.type?.startsWith('image/')) {
            return { status: false, error: 'Seules les photos sont autorisées.' }
        }

        const response = await cloudinary.v2.uploader.upload(file.tmpPath!, {
            folder,
            resource_type: 'image',
        })

        return { status: true, url: response.secure_url }
    } catch (error) {
        console.error('Erreur Cloudinary:', error)
        return { status: false, error: (error as Error).message }
    }
}
