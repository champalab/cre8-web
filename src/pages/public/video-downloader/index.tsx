import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Music2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import axios from 'axios'
import env from '../../../env'

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
    </svg>
)

const Youtube = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
)

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
)
// Mock Data Type
type VideoResult = {
    title: string
    thumbnail: string
    duration: string
    platform: string
    downloads: {
        quality: string
        format: string
        size: string
        url: string
    }[]
}

const platforms = [
    { name: 'YouTube', icon: Youtube, color: 'text-red-500' },
    { name: 'Facebook', icon: Facebook, color: 'text-blue-500' },
    { name: 'TikTok', icon: Music2, color: 'text-black dark:text-white' }
    // { name: 'Instagram', icon: Instagram, color: 'text-pink-500' }
]

const VideoDownloader: React.FC = () => {
    const [url, setUrl] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState<VideoResult | null>(null)
    const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null)

    const handleDownloadFile = async (dlUrl: string, title: string, idx: number) => {
        setDownloadingIdx(idx)
        setError('')
        try {
            const response = await fetch(dlUrl)
            if (!response.ok) throw new Error('Download failed')

            let filename = `${title}.mp4`
            const contentDisposition = response.headers.get('content-disposition')
            if (contentDisposition && contentDisposition.includes('filename=')) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/)
                if (match) filename = decodeURIComponent(match[1])
            }

            const blob = await response.blob()
            const objectUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = objectUrl
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(objectUrl)
        } catch (err) {
            console.error('Download error:', err)
            setError('ເກີດຂໍ້ຜິດພາດໃນການດາວໂຫຼດວິດີໂອ. ອາດຈະໃຊ້ເວລາດົນເກີນໄປ.')
        } finally {
            setDownloadingIdx(null)
        }
    }

    const handleDownload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url) {
            setError('ກະລຸນາວາງລິ້ງວິດີໂອທີ່ຕ້ອງການດາວໂຫຼດ')
            return
        }
        if (!url.includes('http')) {
            setError('ລິ້ງບໍ່ຖືກຕ້ອງ, ກະລຸນາກວດສອບຄືນໃໝ່.')
            return
        }

        // Reset states
        setError('')
        setResult(null)
        setIsLoading(true)

        try {
            const apiUrl = `${env.VITE_APP_API_PATH}/v1/public/tools/download-video`
            const response = await axios.post(apiUrl, { url })

            if (response.data && response.data.success) {
                setResult(response.data.data)
            } else {
                setError(response.data?.message || 'ບໍ່ສາມາດດຶງຂໍ້ມູນວິດີໂອໄດ້')
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ກັບເຊີບເວີ')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pt-20 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight"
                    >
                        ດາວໂຫຼດວິດີໂອ <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">ຄຸນນະພາບສູງ</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
                    >
                        ວາງລິ້ງວິດີໂອຈາກແພລັດຟອມທີ່ທ່ານມັກ ແລ້ວດາວໂຫຼດໄດ້ທັນທີ ຟຣີ, ໄວ ແລະ ບໍ່ມີລາຍນ້ຳ.
                    </motion.p>
                </div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 border border-white/20 dark:border-slate-700/50"
                >
                    {/* Input Form */}
                    <form onSubmit={handleDownload} className="relative mb-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="ວາງລິ້ງວິດີໂອຢູ່ທີ່ນີ້..."
                                    className="w-full pl-6 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all duration-300 text-lg text-slate-800 dark:text-white placeholder:text-slate-400 shadow-inner"
                                />
                                {url && (
                                    <button
                                        type="button"
                                        onClick={() => setUrl('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        ລຶບ
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <Download className="w-6 h-6" />
                                        <span>ດາວໂຫຼດ</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute -bottom-8 left-2 flex items-center gap-2 text-red-500 text-sm font-medium"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                    {/* Supported Platforms */}
                    <div className="flex flex-wrap items-center justify-center gap-6 pt-4 pb-2 border-t border-slate-200 dark:border-slate-700/50">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-full text-center md:w-auto">ຮອງຮັບ:</span>
                        {platforms.map((platform, index) => (
                            <motion.div
                                key={platform.name}
                                whileHover={{ scale: 1.1, y: -2 }}
                                className={`flex items-center gap-2 ${platform.color} opacity-80 hover:opacity-100 transition-opacity`}
                            >
                                <platform.icon className="w-5 h-5" />
                                <span className="font-semibold">{platform.name}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Result Area */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mt-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700/50"
                        >
                            <div className="flex flex-col md:flex-row">
                                {/* Thumbnail */}
                                <div className="md:w-2/5 relative h-64 md:h-auto bg-slate-200 dark:bg-slate-900">
                                    <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-medium backdrop-blur-md">
                                        {result.duration}
                                    </div>
                                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-sm flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                        {result.platform}
                                    </div>
                                </div>

                                {/* Details & Downloads */}
                                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{result.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                            ເລືອກຄວາມລະອຽດທີ່ຕ້ອງການດາວໂຫຼດ. ໄຟລ໌ຈະຖືກບັນທຶກລົງໃນອຸປະກອນຂອງທ່ານ.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {result.downloads.map((dl, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleDownloadFile(dl.url, result.title, idx)}
                                                disabled={downloadingIdx !== null}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 group hover:shadow-md ${
                                                    idx === 0
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-500'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-400'
                                                } ${downloadingIdx !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`font-bold ${idx === 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}
                                                    >
                                                        {dl.quality}
                                                    </span>
                                                    <span className="text-xs font-medium px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                                                        {dl.format}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm text-slate-500 font-medium">{dl.size}</span>
                                                    <div
                                                        className={`p-2 rounded-lg ${
                                                            idx === 0
                                                                ? 'bg-indigo-600 text-white group-hover:bg-indigo-700'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-slate-700'
                                                        } transition-colors`}
                                                    >
                                                        {downloadingIdx === idx ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Download className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default VideoDownloader
