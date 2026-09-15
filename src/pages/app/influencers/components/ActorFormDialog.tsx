import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { alertError, alertWarning } from '../../../../utils/alerts'
import { Actor } from '@/stores/services/actorApi'
import { useUploadFilesMutation } from '@/stores/services/filesApi'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import SafeImage from '@/components/ui/SafeImage'
import { Loader2, Camera, User, Phone, MapPin, Banknote, Trash2, Briefcase, FileImage, Contact, DollarSign, Mail, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ActorFormValues } from './utils'
import { useGetProvincesQuery } from '@/stores/services/provinceApi'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ActorFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    actor: Actor | null
    form: ActorFormValues
    onFormChange: (form: ActorFormValues) => void
    onSubmit: () => void
    isSubmitting?: boolean
}

const steps = [
    { id: 'gallery', labelKey: 'influencers.formPhotos' as const, icon: FileImage },
    { id: 'profile', labelKey: 'influencers.formBasic' as const, icon: User },
    { id: 'contact', labelKey: 'influencers.formContact' as const, icon: Contact },
    { id: 'commercial', labelKey: 'influencers.formRates' as const, icon: DollarSign }
]

export const ActorFormDialog = ({ open, onOpenChange, actor, form, onFormChange, onSubmit, isSubmitting = false }: ActorFormDialogProps) => {
    const { t } = useTranslation('app')
    const { data: provinceData } = useGetProvincesQuery()
    const provinces = provinceData?.data || []
    const [uploadFiles, { isLoading: isUploading }] = useUploadFilesMutation()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [activeTab, setActiveTab] = useState(steps[0].id)
    const [isDragging, setIsDragging] = useState(false)
    const dragDepth = useRef(0)

    useEffect(() => {
        if (open) {
            setActiveTab(steps[0].id)
            setIsDragging(false)
            dragDepth.current = 0
        }
    }, [open])

    const currentStepIndex = steps.findIndex((s) => s.id === activeTab)
    const handleNext = () => {
        if (activeTab === 'gallery' && (form.profile_urls || []).length === 0) {
            return alertWarning({ text: t('influencers.needPhoto') })
        }
        if (activeTab === 'profile' && !form.name.trim()) {
            return alertWarning({ text: t('influencers.needName') })
        }
        if (currentStepIndex < steps.length - 1) setActiveTab(steps[currentStepIndex + 1].id)
    }
    const handlePrev = () => {
        if (currentStepIndex > 0) setActiveTab(steps[currentStepIndex - 1].id)
    }

    const uploadImages = async (fileList: FileList | File[]) => {
        const files = Array.from(fileList)
        if (files.length === 0) return

        const images = files.filter((file) => file.type.startsWith('image/'))
        if (images.length === 0) {
            return alertWarning({ text: t('influencers.imageOnly') })
        }

        const formData = new FormData()
        images.forEach((file) => formData.append('images', file))

        try {
            const response = await uploadFiles(formData).unwrap()
            if (response.status !== 'success') {
                return alertError({ text: t('influencers.uploadFailed') })
            }
            const urls = [...(form.profile_urls || []), ...response.data]
            onFormChange({
                ...form,
                profile_urls: urls,
                profile_url: urls.length > 0 ? urls[0] : ''
            })
            if (images.length < files.length) {
                alertWarning({ text: t('influencers.someSkipped') })
            }
        } catch (error) {
            console.error('Failed to upload files', error)
            alertError({ text: t('influencers.uploadFailed') })
        }
    }

    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
        dragDepth.current = 0
        setIsDragging(false)
        if (isUploading) return
        await uploadImages(event.dataTransfer.files)
    }

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
        event.dataTransfer.dropEffect = 'copy'
    }

    const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
        dragDepth.current += 1
        setIsDragging(true)
    }

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
        dragDepth.current = Math.max(0, dragDepth.current - 1)
        if (dragDepth.current === 0) setIsDragging(false)
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.target
        const files = input.files
        if (files && files.length > 0) await uploadImages(files)
        // allow picking the same file again
        input.value = ''
    }

    const openFilePicker = () => fileInputRef.current?.click()

    const removeImage = (index: number) => {
        const newUrls = (form.profile_urls || []).filter((_, i) => i !== index)
        onFormChange({
            ...form,
            profile_urls: newUrls,
            profile_url: newUrls.length > 0 ? newUrls[0] : ''
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl overflow-hidden flex flex-col p-0 border-border/60 bg-background shadow-2xl backdrop-blur-xl sm:rounded-2xl"
            >
                {/* kept outside <Tabs> so the picker still works when the gallery step is unmounted */}
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />

                <DialogHeader className="px-6 py-4 border-b border-border/40 bg-muted/20">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        {actor ? (
                            <>
                                <Briefcase className="size-5 text-primary" /> {t('influencers.editProfileTitle')}
                            </>
                        ) : (
                            <>
                                <User className="size-5 text-primary" /> {t('influencers.createProfileTitle')}
                            </>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <div className="px-8 pt-6 pb-4 border-b border-border/40 bg-background">
                        <div className="relative max-w-lg mx-auto py-2">
                            <div className="grid grid-cols-4 relative z-10">
                                {steps.map((step, idx) => {
                                    const isActive = currentStepIndex === idx
                                    const isCompleted = currentStepIndex > idx
                                    return (
                                        <div
                                            key={step.id}
                                            className="flex flex-col items-center gap-2 cursor-pointer bg-background relative"
                                            onClick={() => setActiveTab(step.id)}
                                        >
                                            <span
                                                className={`text-[12px] font-bold tracking-wide ${isActive || isCompleted ? 'text-primary' : 'text-muted-foreground'}`}
                                            >
                                                {t(step.labelKey)}
                                            </span>
                                            <div
                                                className={`flex items-center justify-center size-8 rounded-full border-2 transition-all duration-300 ${isActive || isCompleted ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-muted-foreground/30 bg-background text-muted-foreground font-semibold'}`}
                                            >
                                                {isCompleted || isActive ? (
                                                    <Check className="size-4" strokeWidth={3} />
                                                ) : (
                                                    <span className="text-sm">{idx + 1}</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="absolute bottom-[24px] left-[12.5%] right-[12.5%] h-[2px] bg-muted/60 z-0 rounded-full" />
                            <div
                                className="absolute bottom-[24px] left-[12.5%] h-[2px] bg-primary z-0 transition-all duration-500 ease-in-out rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 75}%` }}
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1 overflow-y-auto px-6 py-6">
                        <TabsContent value="profile" className="m-0 space-y-6">
                            <div className="flex flex-col sm:flex-row gap-8 items-start">
                                {/* Avatar Upload Section */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative group cursor-pointer" onClick={openFilePicker}>
                                        <Avatar className="size-32 rounded-2xl border-4 border-background shadow-xl bg-muted/30">
                                            <AvatarImage src={form.profile_url || undefined} className="object-cover" />
                                            <AvatarFallback className="rounded-2xl bg-primary/10 text-4xl text-primary font-bold">
                                                {form.name ? form.name.charAt(0).toUpperCase() : '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                            <Camera className="size-6 text-white" />
                                            <span className="text-white text-[10px] font-bold uppercase tracking-wider">{t('influencers.upload')}</span>
                                        </div>
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                                <Loader2 className="size-6 animate-spin text-primary" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground/70 uppercase tracking-widest font-semibold">{t('influencers.primaryPhoto')}</div>
                                </div>

                                <div className="flex-1 grid gap-5 w-full">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="actor_name">{t('influencers.fullNameStar')}</Label>
                                            <Input
                                                id="actor_name"
                                                placeholder={t('influencers.namePlaceholder')}
                                                value={form.name}
                                                onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                                                className="bg-muted/30"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="actor_status">{t('influencers.accountStatusStar')}</Label>
                                            <Select
                                                value={form.status}
                                                onValueChange={(status: ActorFormValues['status']) => onFormChange({ ...form, status })}
                                            >
                                                <SelectTrigger id="actor_status" className="bg-muted/30">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">{t('users.active')}</SelectItem>
                                                    <SelectItem value="INACTIVE">{t('users.inactive')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="actor_tags">{t('influencers.tagsNiches')}</Label>
                                            <Input
                                                id="actor_tags"
                                                value={form.tags}
                                                onChange={(e) => onFormChange({ ...form, tags: e.target.value })}
                                                placeholder={t('influencers.tagsPlaceholder')}
                                                className="bg-muted/30"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="actor_code">{t('influencers.referenceCode')}</Label>
                                            <Input
                                                id="actor_code"
                                                value={form.code}
                                                onChange={(e) => onFormChange({ ...form, code: e.target.value })}
                                                placeholder={t('influencers.codePlaceholder')}
                                                className="bg-muted/30 font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="actor_gender">{t('influencers.gender')}</Label>
                                            <Select
                                                value={form.gender}
                                                onValueChange={(gender: ActorFormValues['gender']) => onFormChange({ ...form, gender })}
                                            >
                                                <SelectTrigger id="actor_gender" className="bg-muted/30">
                                                    <SelectValue placeholder={t('influencers.selectGender')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Male">{t('influencers.male')}</SelectItem>
                                                    <SelectItem value="Female">{t('influencers.female')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="actor_dob">{t('influencers.yearOfBirth')}</Label>
                                            <Input
                                                id="actor_dob"
                                                type="number"
                                                min="1900"
                                                max={new Date().getFullYear()}
                                                placeholder={t('influencers.yearPlaceholder')}
                                                value={form.date_of_birth}
                                                onChange={(e) => onFormChange({ ...form, date_of_birth: e.target.value })}
                                                className="bg-muted/30"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="actor_marital">{t('influencers.maritalStatus')}</Label>
                                            <Select
                                                value={form.marital_status}
                                                onValueChange={(marital_status: ActorFormValues['marital_status']) => onFormChange({ ...form, marital_status })}
                                            >
                                                <SelectTrigger id="actor_marital" className="bg-muted/30">
                                                    <SelectValue placeholder={t('influencers.selectStatus')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Single">{t('influencers.single')}</SelectItem>
                                                    <SelectItem value="Married without kids">{t('influencers.marriedNoKids')}</SelectItem>
                                                    <SelectItem value="Married with kids">{t('influencers.marriedWithKids')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="actor_source">{t('influencers.acquisitionSource')}</Label>
                                            <Select
                                                value={form.source}
                                                onValueChange={(source: ActorFormValues['source']) => onFormChange({ ...form, source })}
                                            >
                                                <SelectTrigger id="actor_source" className="bg-muted/30">
                                                    <SelectValue placeholder={t('influencers.selectSource')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Rizz">Rizz</SelectItem>
                                                    <SelectItem value="Freelance">Freelance</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="contact" className="m-0 space-y-6">
                            <div className="grid gap-6">
                                <div className="grid sm:grid-cols-2 gap-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="actor_phone_number" className="flex items-center gap-2">
                                            <Phone className="size-3.5 text-muted-foreground" /> {t('influencers.phoneNumber')}
                                        </Label>
                                        <Input
                                            id="actor_phone_number"
                                            type="tel"
                                            inputMode="tel"
                                            value={form.phone_number}
                                            onChange={(e) => onFormChange({ ...form, phone_number: e.target.value })}
                                            placeholder="020 5555 5555"
                                            className="bg-muted/30"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="actor_email" className="flex items-center gap-2">
                                            <Mail className="size-3.5 text-muted-foreground" /> {t('influencers.emailAddress')}
                                        </Label>
                                        <Input
                                            id="actor_email"
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => onFormChange({ ...form, email: e.target.value })}
                                            placeholder="name@example.com"
                                            className="bg-muted/30"
                                        />
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t('influencers.otpLoginHint')}</p>
                                    </div>
                                </div>

                                <div className="p-5 border border-border/50 rounded-xl bg-muted/10 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="size-4 text-primary" />
                                        <h4 className="text-sm font-semibold tracking-wide">{t('influencers.locationDetails')}</h4>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div className="grid gap-2">
                                            <Label htmlFor="actor_province">{t('influencers.province')}</Label>
                                            <Select
                                                value={form.province_id ? form.province_id.toString() : ''}
                                                onValueChange={(val) => onFormChange({ ...form, province_id: val ? Number(val) : '' })}
                                            >
                                                <SelectTrigger id="actor_province" className="bg-background">
                                                    <SelectValue placeholder={t('influencers.selectProvince')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {provinces.map((p) => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>
                                                            {p.nameEng || p.nameLao}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="actor_address">{t('influencers.addressExpress')}</Label>
                                            <Input
                                                id="actor_address"
                                                value={form.address_express}
                                                onChange={(e) => onFormChange({ ...form, address_express: e.target.value })}
                                                placeholder={t('influencers.addressPlaceholder')}
                                                className="bg-background"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="commercial" className="m-0 space-y-6">
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-5">
                                    <h4 className="text-sm font-semibold border-b border-border/40 pb-2 flex items-center gap-2">
                                        <Banknote className="size-4 text-primary" /> {t('influencers.serviceRates')}
                                    </h4>
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                                            <Label htmlFor="actor_price">{t('influencers.standardPrice')}</Label>
                                            <Input
                                                id="actor_price"
                                                type="text"
                                                className="w-32 bg-muted/30 text-right"
                                                placeholder="0"
                                                value={
                                                    form.standard_price !== '' && form.standard_price !== undefined
                                                        ? Number(form.standard_price).toLocaleString('en-US')
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/,/g, '')
                                                    if (rawValue === '') onFormChange({ ...form, standard_price: '' })
                                                    else if (/^\d+$/.test(rawValue)) onFormChange({ ...form, standard_price: Number(rawValue) })
                                                }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                                            <Label htmlFor="actor_price_photo">{t('influencers.photoOnly')}</Label>
                                            <Input
                                                id="actor_price_photo"
                                                type="text"
                                                className="w-32 bg-muted/30 text-right"
                                                placeholder="0"
                                                value={
                                                    form.price_photo !== '' && form.price_photo !== undefined
                                                        ? Number(form.price_photo).toLocaleString('en-US')
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/,/g, '')
                                                    if (rawValue === '') onFormChange({ ...form, price_photo: '' })
                                                    else if (/^\d+$/.test(rawValue)) onFormChange({ ...form, price_photo: Number(rawValue) })
                                                }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                                            <Label htmlFor="actor_price_video">{t('influencers.videoOnly')}</Label>
                                            <Input
                                                id="actor_price_video"
                                                type="text"
                                                className="w-32 bg-muted/30 text-right"
                                                placeholder="0"
                                                value={
                                                    form.price_video !== '' && form.price_video !== undefined
                                                        ? Number(form.price_video).toLocaleString('en-US')
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/,/g, '')
                                                    if (rawValue === '') onFormChange({ ...form, price_video: '' })
                                                    else if (/^\d+$/.test(rawValue)) onFormChange({ ...form, price_video: Number(rawValue) })
                                                }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                                            <Label htmlFor="actor_price_video_photo">{t('influencers.videoPhoto')}</Label>
                                            <Input
                                                id="actor_price_video_photo"
                                                type="text"
                                                className="w-32 bg-muted/30 text-right"
                                                placeholder="0"
                                                value={
                                                    form.price_video_photo !== '' && form.price_video_photo !== undefined
                                                        ? Number(form.price_video_photo).toLocaleString('en-US')
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/,/g, '')
                                                    if (rawValue === '') onFormChange({ ...form, price_video_photo: '' })
                                                    else if (/^\d+$/.test(rawValue)) onFormChange({ ...form, price_video_photo: Number(rawValue) })
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl border border-border/50 bg-muted/10 space-y-4">
                                        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                                            <Label htmlFor="actor_client_repost">{t('influencers.clientRepostAllowed')}</Label>
                                            <Select
                                                value={form.client_repost ? 'true' : 'false'}
                                                onValueChange={(val) => onFormChange({ ...form, client_repost: val === 'true' })}
                                            >
                                                <SelectTrigger id="actor_client_repost" className="w-32 bg-background">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="true">{t('influencers.yes')}</SelectItem>
                                                    <SelectItem value="false">{t('influencers.no')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {form.client_repost && (
                                            <div className="grid grid-cols-[1fr_auto] items-center gap-4 pt-2 border-t border-border/40">
                                                <Label htmlFor="actor_additional_charge" className="text-muted-foreground text-xs">
                                                    {t('influencers.additionalCharge')}
                                                </Label>
                                                <Input
                                                    id="actor_additional_charge"
                                                    type="text"
                                                    className="w-32 bg-background text-right"
                                                    placeholder="0"
                                                    value={
                                                        form.additional_charge_amount !== '' && form.additional_charge_amount !== undefined
                                                            ? Number(form.additional_charge_amount).toLocaleString('en-US')
                                                            : ''
                                                    }
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/,/g, '')
                                                        if (rawValue === '') onFormChange({ ...form, additional_charge_amount: '' })
                                                        else if (/^\d+$/.test(rawValue)) onFormChange({ ...form, additional_charge_amount: Number(rawValue) })
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <h4 className="text-sm font-semibold border-b border-border/40 pb-2 flex items-center gap-2">
                                        <Banknote className="size-4 text-emerald-500" /> {t('influencers.bankDetails')}
                                    </h4>
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="actor_bank_name">{t('influencers.accountName')}</Label>
                                            <Input
                                                id="actor_bank_name"
                                                value={form.bank_account_name}
                                                onChange={(e) => onFormChange({ ...form, bank_account_name: e.target.value })}
                                                placeholder={t('influencers.accountNamePlaceholder')}
                                                className="bg-muted/30 uppercase"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="actor_bank_no">{t('influencers.accountNumber')}</Label>
                                            <Input
                                                id="actor_bank_no"
                                                value={form.bank_account_number}
                                                onChange={(e) => onFormChange({ ...form, bank_account_number: e.target.value })}
                                                placeholder={t('influencers.accountNumberPlaceholder')}
                                                className="bg-muted/30 font-mono tracking-widest text-lg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="gallery" className="m-0 space-y-6">
                            <div
                                className={`space-y-4 rounded-xl transition-colors ${isDragging ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5' : ''}`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                            >
                                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                                    <div>
                                        <h4 className="text-sm font-semibold">{t('influencers.mediaGallery')}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {t('influencers.mediaGalleryDesc')}
                                        </p>
                                    </div>
                                    <Button onClick={openFilePicker} variant="secondary" disabled={isUploading} className="gap-2">
                                        {isUploading ? <Loader2 className="size-4 animate-spin" /> : <FileImage className="size-4" />}
                                        {t('influencers.uploadPhotos')}
                                    </Button>
                                </div>

                                {form.profile_urls && form.profile_urls.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        <div
                                            className="flex flex-col items-center justify-center aspect-[3/4] rounded-xl border-2 border-dashed border-border/60 bg-muted/5 cursor-pointer hover:bg-muted/10 transition-colors text-center px-2"
                                            onClick={openFilePicker}
                                        >
                                            {isUploading ? (
                                                <Loader2 className="size-6 animate-spin text-primary" />
                                            ) : (
                                                <>
                                                    <Camera className="size-7 text-muted-foreground/40 mb-2" />
                                                    <p className="text-[11px] font-medium text-muted-foreground">{t('influencers.addMore')}</p>
                                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{t('influencers.dragDropOrClick')}</p>
                                                </>
                                            )}
                                        </div>

                                        {form.profile_urls.map((url, i) => (
                                            <div
                                                key={i}
                                                className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-muted/20 border border-border/40 shadow-sm hover:shadow-md transition-all"
                                            >
                                                <SafeImage
                                                    src={url}
                                                    alt={t('influencers.galleryAlt', { index: i + 1 })}
                                                    variant="gallery"
                                                    className="w-full h-full object-cover"
                                                />


                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button
                                                        size="icon"
                                                        variant="destructive"
                                                        className="size-8 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform"
                                                        onClick={() => removeImage(i)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                                {i === 0 && (
                                                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                                                        {t('influencers.primary')}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div
                                        className={`flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border/60 bg-muted/5 hover:bg-muted/10'}`}
                                        onClick={openFilePicker}
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="size-10 animate-spin text-primary mb-3" />
                                                <p className="text-sm font-medium text-muted-foreground">{t('influencers.uploading')}</p>
                                            </>
                                        ) : (
                                            <>
                                                <Camera className={`size-10 mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground/30'}`} />
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    {isDragging ? t('influencers.dropImagesHere') : t('influencers.noPhotosYet')}
                                                </p>
                                                <p className="text-xs text-muted-foreground/60 mt-1">{t('influencers.dragDropUpload')}</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/20 flex flex-row sm:justify-between items-center w-full">
                    <Button variant="outline" onClick={() => (currentStepIndex > 0 ? handlePrev() : onOpenChange(false))} className="rounded-xl">
                        {currentStepIndex > 0 ? t('common:back') : t('common:cancel')}
                    </Button>
                    {currentStepIndex < steps.length - 1 ? (
                        <Button onClick={handleNext} className="rounded-xl px-8 shadow-md">
                            {t('influencers.nextStep')}
                        </Button>
                    ) : (
                        <Button onClick={onSubmit} disabled={isSubmitting} className="rounded-xl px-8 shadow-md">
                            {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                            {actor ? t('influencers.saveChanges') : t('influencers.createProfile')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
