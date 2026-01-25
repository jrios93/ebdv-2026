import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkClassroomNames() {
  console.log('🔍 Checking current classroom names...')
  
  try {
    // Get all classrooms
    const { data: classrooms, error: fetchError } = await supabase
      .from('classrooms')
      .select('id, nombre')
    
    if (fetchError) throw fetchError
    
    console.log(`Found ${classrooms.length} classrooms:`)
    
    classrooms.forEach(classroom => {
      const currentName = classroom.nombre
      const capitalizedName = currentName.charAt(0).toUpperCase() + currentName.slice(1).toLowerCase()
      const status = currentName === capitalizedName ? '✅' : '⚠️'
      
      console.log(`${status} "${currentName}" → "${capitalizedName}"`)
    })
    
    console.log('\n📝 Manual SQL to update names (run in Supabase SQL Editor):')
    console.log('-- Copy and paste this SQL in Supabase SQL Editor:')
    
    classrooms.forEach(classroom => {
      const currentName = classroom.nombre
      const capitalizedName = currentName.charAt(0).toUpperCase() + currentName.slice(1).toLowerCase()
      
      if (currentName !== capitalizedName) {
        console.log(`UPDATE classrooms SET nombre = '${capitalizedName}' WHERE id = '${classroom.id}';`)
      }
    })
    
    console.log('\n✅ Classroom name check completed!')
    
  } catch (error) {
    console.error('❌ Error during check:', error)
    process.exit(1)
  }
}

checkClassroomNames()