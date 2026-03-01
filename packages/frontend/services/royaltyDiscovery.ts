export async function auditRegistrations(userId: string) {
  const res = await fetch(`http://localhost:8000/api/royalty-discovery?userId=${userId}`);
  return res.json();
}
