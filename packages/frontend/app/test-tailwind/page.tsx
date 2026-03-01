export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="space-y-4">
        <div className="bg-red-500 text-white p-4 rounded-lg">
          🔴 RED - If you see this, Tailwind is working
        </div>
        <div className="bg-blue-500 text-white p-4 rounded-lg">
          🔵 BLUE - If you see this, Tailwind is working
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg">
          🟢 GREEN - If you see this, Tailwind is working
        </div>
      </div>
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">
        🌈 GRADIENT - If you see purple to pink, gradients work
      </div>
    </div>
  )
}
