const BIRTH_DATE = new Date(2009, 4, 17) // May 17, 2009

export function getAge(): number {
  const now = new Date()
  let age = now.getFullYear() - BIRTH_DATE.getFullYear()
  const monthDiff = now.getMonth() - BIRTH_DATE.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < BIRTH_DATE.getDate())) {
    age--
  }
  return age
}
