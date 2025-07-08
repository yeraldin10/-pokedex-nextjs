import { NextRequest, NextResponse } from 'next/server'

// 🔍 Tipos para las respuestas de la API de Pokemon
interface PokemonApiListItem {
  name: string
  url: string
}

interface PokemonApiListResponse {
  count: number
  next: string | null
  previous: string | null
  results: PokemonApiListItem[]
}

interface PokemonType {
  type: {
    name: string
    url: string
  }
  slot: number
}

interface PokemonDetailResponse {
  id: number
  name: string
  sprites: {
    front_default: string
  }
  types: PokemonType[]
}

// 🔍 Tipos para nuestras respuestas
interface PokemonListItem {
  name: string
  url: string
  id: number
  image: string
  types: string[]
}

interface ApiResponse {
  pokemons: PokemonListItem[]
  total: number
  search?: string
}

// 📦 GET - Obtener lista de pokémons (con búsqueda)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') || '20'
  const search = searchParams.get('search') || ''
  
  try {
    // Obtener lista básica
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`, {
      cache: 'force-cache'
    })
    
    if (!res.ok) {
      throw new Error('Error al obtener pokémons')
    }
    
    const data: PokemonApiListResponse = await res.json()
    
    // Enriquecer con detalles para búsqueda
    const enrichedPokemons = await Promise.all(
      data.results.map(async (pokemon: PokemonApiListItem) => {
        const detailRes = await fetch(pokemon.url, { cache: 'force-cache' })
        const detail: PokemonDetailResponse = await detailRes.json()
        
        return {
          name: detail.name,
          url: pokemon.url,
          id: detail.id,
          image: detail.sprites.front_default,
          types: detail.types.map((t: PokemonType) => t.type.name)
        }
      })
    )
    
    // Filtrar por búsqueda si existe
    const filteredPokemons = search
      ? enrichedPokemons.filter(p => 
          p.name.toLowerCase().includes(search.toLowerCase())
        )
      : enrichedPokemons
    
    const response: ApiResponse = {
      pokemons: filteredPokemons,
      total: data.count,
      search
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al cargar pokémons' },
      { status: 500 }
    )
  }
}