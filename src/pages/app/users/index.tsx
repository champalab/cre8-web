import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateUserMutation, useFetchUsersMutation, useUpdateUserMutation } from '../../../stores/services/userApi'
import BackdropComponent from '../../../components/BackdropComponent'
import { PageHeader } from '@/components/page-header'
import UserModal from './component/UserModal'
import TableComponent from './component/TableComponent'
import CardFilter from './component/CardFilter'
import { Filter } from './type'

const UsersPage: React.FC = () => {
    const { t } = useTranslation('app')
    const [page] = useState(1)

    const [filter, setFilter] = useState<Filter>({
        keyword: null
    })

    const [data, setData] = useState([])

    const [onFetch, { isLoading }] = useFetchUsersMutation()
    const [onCreate, { isLoading: isLoadingCreate }] = useCreateUserMutation()
    const [onUpdate, { isLoading: isLoadingUpdate }] = useUpdateUserMutation()

    const refetch = async () => {
        const result = await onFetch({ ...filter, page })
        if ('data' in result && result.data && result.data.status === 'success') {
            setData(result.data.data)
        }
    }

    useEffect(() => {
        refetch()
    }, [page])

    return (
        <div>
            <BackdropComponent open={isLoading || isLoadingUpdate || isLoadingCreate} />
            <PageHeader
                title={t('users.title')}
                actions={<UserModal mode="create" onSubmit={onCreate} refetch={refetch} />}
            />
            <CardFilter onClick={refetch} setQuery={setFilter} query={filter} />
            <TableComponent data={data} refetch={refetch} onUpdate={onUpdate} />
        </div>
    )
}

export default UsersPage
