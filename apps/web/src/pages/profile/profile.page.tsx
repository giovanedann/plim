import { Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { AvatarUpload } from './components/avatar-upload'
import { DangerZoneSection } from './components/danger-zone-section'
import { DataExportSection } from './components/data-export-section'
import { ProfileForm } from './components/profile-form'
import { useProfilePage } from './use-profile.page'

function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="h-32 w-32 rounded-full" />
      <div className="w-full space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

function ProfileDisplay({
  profile,
  onEdit,
}: {
  profile: NonNullable<ReturnType<typeof useProfilePage>['profile']>
  onEdit: () => void
}) {
  const currencyLabel =
    { BRL: 'Real (BRL)', USD: 'Dólar (USD)', EUR: 'Euro (EUR)' }[profile.currency] ??
    profile.currency
  const localeLabel =
    { 'pt-BR': 'Português (Brasil)', 'en-US': 'English (US)' }[profile.locale] ?? profile.locale

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Nome</p>
          <p className="font-medium">{profile.name ?? '-'}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar perfil">
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Email</p>
        <p className="font-medium">{profile.email}</p>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Moeda</p>
        <p className="font-medium">{currencyLabel}</p>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Idioma</p>
        <p className="font-medium">{localeLabel}</p>
      </div>
    </div>
  )
}

export function ProfilePage() {
  const {
    profile,
    isLoading,
    isEditing,
    setIsEditing,
    updateProfile,
    isUpdating,
    uploadAvatar,
    isUploadingAvatar,
    deleteAvatar,
    isDeletingAvatar,
  } = useProfilePage()

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Suas informações pessoais e preferências</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ProfileSkeleton />
            ) : profile ? (
              <div className="space-y-8">
                <AvatarUpload
                  avatarUrl={profile.avatar_url}
                  name={profile.name}
                  onUpload={uploadAvatar}
                  onDelete={deleteAvatar}
                  isUploading={isUploadingAvatar}
                  isDeleting={isDeletingAvatar}
                />

                {isEditing ? (
                  <ProfileForm
                    profile={profile}
                    onSubmit={updateProfile}
                    onCancel={() => setIsEditing(false)}
                    isSubmitting={isUpdating}
                  />
                ) : (
                  <ProfileDisplay profile={profile} onEdit={() => setIsEditing(true)} />
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Erro ao carregar perfil</p>
            )}
          </CardContent>
        </Card>

        <DataExportSection />

        <DangerZoneSection />
      </div>
    </div>
  )
}
