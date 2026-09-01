import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/request-auth";
import { saveProfile } from "@/lib/store";
export async function POST(request: Request) { try { const userId = await requireUserId(); const { name, dateOfBirth, examGoal } = await request.json(); if (![name, dateOfBirth, examGoal].every((v) => typeof v === "string" && v.trim())) return NextResponse.json({ error: "Complete all fields" }, { status: 400 }); await saveProfile(userId, { name: name.trim(), dateOfBirth, examGoal: examGoal.trim() }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); } }
