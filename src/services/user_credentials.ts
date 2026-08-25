import pb from '@/lib/pocketbase/client'

export interface UserCredential {
  id: string
  user: string
  password_plain: string
  created: string
  updated: string
}

/**
 * Busca todas as credenciais registradas (apenas Adriano tem permissão de leitura).
 */
export const getUserCredentials = async (): Promise<UserCredential[]> => {
  return pb.collection('user_credentials').getFullList<UserCredential>()
}

/**
 * Busca a credencial de um usuário específico por ID do usuário.
 */
export const getUserCredentialByUserId = async (userId: string): Promise<UserCredential | null> => {
  try {
    return await pb
      .collection('user_credentials')
      .getFirstListItem<UserCredential>(`user = "${userId}"`)
  } catch {
    return null
  }
}

/**
 * Grava ou atualiza a senha em texto puro na coleção user_credentials para um usuário.
 */
export const upsertUserCredential = async (
  userId: string,
  passwordPlain: string,
): Promise<UserCredential> => {
  try {
    const existing = await pb
      .collection('user_credentials')
      .getFirstListItem<UserCredential>(`user = "${userId}"`)
    return await pb.collection('user_credentials').update<UserCredential>(existing.id, {
      password_plain: passwordPlain,
    })
  } catch {
    return await pb.collection('user_credentials').create<UserCredential>({
      user: userId,
      password_plain: passwordPlain,
    })
  }
}

/**
 * Exclui o registro de user_credentials associado ao userId se existir.
 */
export const deleteUserCredentialByUserId = async (userId: string): Promise<void> => {
  try {
    const existing = await pb
      .collection('user_credentials')
      .getFirstListItem<UserCredential>(`user = "${userId}"`)
    await pb.collection('user_credentials').delete(existing.id)
  } catch {
    // Registro pode não existir ou já ter sido removido por cascadeDelete
  }
}
