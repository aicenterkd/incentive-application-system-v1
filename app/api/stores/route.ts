import { NextResponse } from "next/server"
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client"
import * as memoryStore from "@/lib/store"

const EXAMPLE_STORES = [
  { name: "행복마트 향남점", address: "경기도 화성시 향남읍 은행나무로 23" },
  { name: "행복마트 송산점", address: "경기도 화성시 송산면 송산로 45" },
  { name: "행복마트 정남점", address: "경기도 화성시 정남면 정남로 78" },
  { name: "행복마트 팔탄점", address: "경기도 화성시 팔탄면 팔탄로 12" },
  { name: "행복마트 비봉점", address: "경기도 화성시 비봉면 비봉로 56" },
  { name: "행복마트 마도점", address: "경기도 화성시 마도면 마도로 34" },
  { name: "행복마트 남양점", address: "경기도 화성시 남양읍 남양로 67" },
  { name: "행복마트 매송점", address: "경기도 화성시 매송면 매송로 89" },
  { name: "행복마트 봉담점", address: "경기도 화성시 봉담읍 봉담로 101" },
  { name: "행복마트 동탄점", address: "경기도 화성시 동탄면 동탄로 234" },
  { name: "행복마트 진안점", address: "경기도 화성시 진안동 진안로 456" },
  { name: "행복마트 병점점", address: "경기도 화성시 병점동 병점로 789" },
  { name: "행복마트 기배점", address: "경기도 화성시 기배동 기배로 321" },
  { name: "행복마트 반월점", address: "경기도 화성시 반월동 반월로 654" },
  { name: "행복마트 석우점", address: "경기도 화성시 석우동 석우로 987" },
]

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      // Fallback: combine in-memory stores with example stores
      const memStores = memoryStore.getStores()
      const storeMap = new Map<string, string>()
      for (const s of memStores) {
        storeMap.set(s.name, s.address)
      }
      for (const s of EXAMPLE_STORES) {
        if (!storeMap.has(s.name)) storeMap.set(s.name, s.address)
      }
      const stores = Array.from(storeMap.entries())
        .map(([name, address]) => ({ name, address }))
        .sort((a, b) => a.name.localeCompare(b.name, "ko"))
      return NextResponse.json(stores)
    }

    const { data: apps, error } = await supabaseAdmin
      .from("applications")
      .select("store_name, store_address")
      .not("store_name", "is", null)
      .not("store_address", "is", null)

    const storeMap = new Map<string, string>()
    if (!error && apps) {
      for (const app of apps) {
        if (app.store_name && app.store_address) {
          storeMap.set(app.store_name, app.store_address)
        }
      }
    }
    for (const s of EXAMPLE_STORES) {
      if (!storeMap.has(s.name)) storeMap.set(s.name, s.address)
    }
    const stores = Array.from(storeMap.entries())
      .map(([name, address]) => ({ name, address }))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"))
    return NextResponse.json(stores)
  } catch (error) {
    console.error("Store fetch error:", error)
    return NextResponse.json(EXAMPLE_STORES)
  }
}
