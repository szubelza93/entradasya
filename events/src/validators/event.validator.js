

const { z } = require('zod');

const sectorSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  precio: z.coerce.number().min(0),
  cupo: z.coerce.number().int().positive()
});

const createEventSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(3).max(160),

    descripcion: z.string()
      .max(10000)
      .optional()
      .nullable(),

    fecha: z.string().datetime({ offset: true }),

    lugar: z.string().trim().min(2).max(220),

    sectores: z.array(sectorSchema).max(100).optional()
  })
});

const updateEventSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(3).max(160).optional(),
    descripcion: z.string().max(10000).optional().nullable(),
    fecha: z.string().datetime({ offset: true }).optional(),
    lugar: z.string().trim().min(2).max(220).optional()
  }).refine(
    data => Object.keys(data).length > 0,
    'Debe enviar al menos un campo.'
  )
});

const createSectorSchema = z.object({
  body: sectorSchema
});

const updateSectorSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(2).max(100).optional(),
    precio: z.coerce.number().min(0).optional(),
    cupo: z.coerce.number().int().positive().optional(),
    activo: z.boolean().optional()
  }).refine(
    data => Object.keys(data).length > 0,
    'Debe enviar al menos un campo.'
  )
});

const eventIdParamsSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive()
  })
});

const sectorIdParamsSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
    sectorId: z.coerce.number().int().positive()
  })
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  createSectorSchema,
  updateSectorSchema,
  eventIdParamsSchema,
  sectorIdParamsSchema
};
