import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { profileService } from '@/services/profile.service'
import type { Profile } from '@plim/shared'

export function useProfilePage() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Pick<Profile, 'name' | 'currency' | 'locale'>>) =>
      profileService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Perfil atualizado')
      setIsEditing(false)
    },
    onError: () => {
      toast.error('Erro ao atualizar perfil')
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error.message)
        return
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Foto atualizada')
    },
    onError: () => {
      toast.error('Erro ao fazer upload da foto')
    },
  })

  const deleteAvatarMutation = useMutation({
    mutationFn: () => profileService.deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Foto removida')
    },
    onError: () => {
      toast.error('Erro ao remover foto')
    },
  })

  const profile = profileResponse?.data ?? null

  return {
    profile,
    isLoading,
    isEditing,
    setIsEditing,
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutate,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    deleteAvatar: deleteAvatarMutation.mutate,
    isDeletingAvatar: deleteAvatarMutation.isPending,
  }
}
