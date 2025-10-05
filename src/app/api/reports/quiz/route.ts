import { NextRequest } from "next/server"
import PDFDocument from "pdfkit"

export const runtime = "nodejs"

type QuizResultPayload = {
  quizTitle: string
  userName?: string
  items: Array<{
    index: number
    prompt: string
    type: "mcq" | "formula" | "simulation"
    correct: boolean
    userAnswer?: string
    expectedAnswer?: string
    extra?: Record<string, unknown>
  }>
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as QuizResultPayload
    const doc = new PDFDocument({ size: "A4", margin: 48 })

    const chunks: Buffer[] = []
    doc.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))

    // Header
    doc.fontSize(18).text("Quiz Report", { align: "center" })
    doc.moveDown(0.5)
    doc.fontSize(12).fillColor("#666").text(new Date().toLocaleString(), { align: "center" })
    doc.moveDown(1)

    // Metadata
    doc.fillColor("#000").fontSize(14).text(body.quizTitle || "Untitled Quiz")
    if (body.userName) {
      doc.fontSize(12).fillColor("#333").text(`User: ${body.userName}`)
    }
    doc.moveDown(0.5)

    const numCorrect = body.items.filter((i) => i.correct).length
    doc.fontSize(12).fillColor("#000").text(`Score: ${numCorrect} / ${body.items.length}`)
    doc.moveDown(1)

    // Table-like list
    body.items.forEach((item) => {
      doc.fontSize(12).fillColor(item.correct ? "#16a34a" : "#b45309")
      doc.text(`Q${item.index + 1}: ${item.prompt}`)
      doc.moveDown(0.2)
      doc.fillColor("#111").text(`Type: ${item.type}`)
      if (item.userAnswer !== undefined) {
        doc.fillColor("#111").text(`Your answer: ${item.userAnswer}`)
      }
      if (item.expectedAnswer !== undefined) {
        doc.fillColor("#111").text(`Expected: ${item.expectedAnswer}`)
      }
      if (item.extra) {
        try {
          doc.fillColor("#666").fontSize(10).text(`Extra: ${JSON.stringify(item.extra)}`)
        } catch {}
      }
      doc.moveDown(0.6)
    })

    doc.end()
    await new Promise<void>((resolve) => doc.on("end", () => resolve()))

    const pdfBuffer = Buffer.concat(chunks)
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quiz-report.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    console.error(e)
    return new Response("Failed to generate PDF", { status: 400 })
  }
}


