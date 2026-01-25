import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xhslnlccbsoyiylmrmxb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc2xubGNjYnNveWl5bG1ybXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMzc2ODQsImV4cCI6MjA4NDcxMzY4NH0.v7IzfGPgeugvl_qejITew44FTNg4AvLmUyIYU2JvndM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixClassroomName() {
  console.log('🔧 Fixing "verdad" classroom name...')
  
  try {
    // Test if we can read the data first
    const { data: classrooms, error: readError } = await supabase
      .from('classrooms')
      .select('id, nombre')
      .eq('id', '5272477b-26a4-4179-a276-1c4730238974')
    
    if (readError) {
      console.error('❌ Error reading classroom:', readError)
      return
    }
    
    console.log('Current classroom data:', classrooms)
    
    // Try to update - this may fail with anon key permissions
    const { data, error } = await supabase
      .from('classrooms')
      .update({ nombre: 'Verdad' })
      .eq('id', '5272477b-26a4-4179-a276-1c4730238974')
      .select()
    
    if (error) {
      console.error('❌ Update failed (expected with anon key):', error.message)
      console.log('\n📝 Manual fix required - Run this SQL in Supabase SQL Editor:')
      console.log("UPDATE classrooms SET nombre = 'Verdad' WHERE id = '5272477b-26a4-4179-a276-1c4730238974';")
    } else {
      console.log('✅ Successfully updated:', data)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixClassroomName()