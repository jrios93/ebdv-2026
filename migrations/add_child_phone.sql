-- Agregar campo telefono_niño a la tabla alumnos
ALTER TABLE alumnos ADD COLUMN telefono_niño VARCHAR(20);

-- Opcional: Agregar comentario para documentar el campo
COMMENT ON COLUMN alumnos.telefono_niño IS 'Teléfono opcional del alumno (niño/a)';