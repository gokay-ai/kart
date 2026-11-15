import type { APIRoute } from 'astro';
import { renderEmblemIconPng } from '../lib/og';

export const GET: APIRoute = () =>
  new Response(renderEmblemIconPng(180) as BodyInit, { headers: { 'Content-Type': 'image/png' } });
