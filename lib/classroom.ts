import { FaSeedling, FaDove, FaBible } from "react-icons/fa";
import { IoSunnySharp } from "react-icons/io5";


export const getClassroomByAge = (age: number): 'vida' | 'luz' | 'gracia' | 'verdad' => {
  if (age >= 3 && age <= 5) return 'vida'
  if (age >= 6 && age <= 9) return 'luz'
  if (age >= 10 && age <= 12) return 'gracia'
  return 'verdad' // 13-15
}

export const getClassroomInfo = (classroom: string) => {
  const info = {
    vida: {
      name: 'Vida',
      icon: FaSeedling,
      emoji: '🌱', // Backup
      color: 'green',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
      textColor: 'text-green-700',
      textMutedColor: 'text-green-600'
    },
    luz: {
      name: 'Luz',
      icon: IoSunnySharp,
      emoji: '⭐', // Backup
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-700',
      textMutedColor: 'text-yellow-600'
    },
    gracia: {
      name: 'Gracia',
      icon: FaDove,
      emoji: '🌟', // Backup
      color: 'red',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      textColor: 'text-red-700',
      textMutedColor: 'text-red-600'
    },
    verdad: {
      name: 'Verdad',
      icon: FaBible,
      emoji: '🎯', // Backup
      color: 'blue',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-700',
      textMutedColor: 'text-blue-600'
    }
  }

  return info[classroom as keyof typeof info] || info.vida
}
