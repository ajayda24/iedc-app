import { requireProfile } from '@/lib/auth/queries'
import {
  getProfileMonthlyPlacements,
  getMyRank,
  listRegistrationsFor,
  listCertificatesFor,
  listEventsByCreator,
} from '@/lib/queries'
import ProfileView from '@/components/dashboard/ProfileView'
import ProfileEditForm from '@/components/dashboard/ProfileEditForm'

// The current user's own profile — editable.
export default async function MyProfilePage() {
  const profile = await requireProfile()
  const isStaff = profile.role === 'coordinator' || profile.role === 'admin'

  const [placements, rankData, registrations, certificates, organized] =
    await Promise.all([
      getProfileMonthlyPlacements(profile.id),
      getMyRank(),
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
      rank={rankData?.me.rank ?? null}
      organizedEvents={isStaff ? organized : undefined}
      editSlot={<ProfileEditForm profile={profile} />}
    />
  )
}
