import { notFound, redirect } from 'next/navigation'
import { getProfile, getProfileById } from '@/lib/auth/queries'
import {
  getProfileMonthlyPlacements,
  getRankFor,
  listRegistrationsFor,
  listCertificatesFor,
  listEventsByCreator,
} from '@/lib/queries'
import ProfileView from '@/components/dashboard/ProfileView'

// Someone else's profile — read-only. If it's actually the current user, send
// them to their own (editable) profile page.
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [me, profile] = await Promise.all([getProfile(), getProfileById(id)])
  if (!profile) notFound()
  if (me?.id === profile.id) redirect('/dashboard/profile')

  const isStaff = profile.role === 'coordinator' || profile.role === 'admin'

  const [placements, rank, registrations, certificates, organized] =
    await Promise.all([
      getProfileMonthlyPlacements(profile.id),
      getRankFor(profile.id),
      listRegistrationsFor(profile.id),
      listCertificatesFor(profile.id),
      isStaff ? listEventsByCreator(profile.id) : Promise.resolve([]),
    ])

  return (
    <ProfileView
      profile={profile}
      registrations={registrations}
      certificates={certificates}
      placements={placements}
      rank={rank}
      organizedEvents={isStaff ? organized : undefined}
    />
  )
}
