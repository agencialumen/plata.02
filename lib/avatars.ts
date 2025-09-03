// Sistema de avatares predefinidos para usuários
export const AVATAR_OPTIONS = [
  {
    id: "avatar-1",
    name: "Gato Preto",
    url: "/cute-black-cat-avatar-minimalist.png",
  },
  {
    id: "avatar-2",
    name: "Borboleta Rosa",
    url: "/pink-butterfly-avatar-minimalist.png",
  },
  {
    id: "avatar-3",
    name: "Lua Crescente",
    url: "/crescent-moon-avatar-minimalist.png",
  },
  {
    id: "avatar-4",
    name: "Estrela Dourada",
    url: "/golden-star-avatar-minimalist.png",
  },
  {
    id: "avatar-5",
    name: "Coração Roxo",
    url: "/purple-heart-avatar-minimalist.png",
  },
  {
    id: "avatar-6",
    name: "Diamante Azul",
    url: "/blue-diamond-avatar-minimalist.png",
  },
  {
    id: "avatar-7",
    name: "Flor Rosa",
    url: "/pink-flower-avatar-minimalist.png",
  },
  {
    id: "avatar-8",
    name: "Cristal Verde",
    url: "/green-crystal-avatar-minimalist.png",
  },
]

export const getRandomAvatar = () => {
  const randomIndex = Math.floor(Math.random() * AVATAR_OPTIONS.length)
  return AVATAR_OPTIONS[randomIndex]
}

export const getAvatarById = (id: string) => {
  return AVATAR_OPTIONS.find((avatar) => avatar.id === id) || AVATAR_OPTIONS[0]
}
