import AppKit
import PDFKit
import CoreImage
guard CommandLine.arguments.count == 2 else { fatalError("Pass the exported ticket path without extension") }
let base = CommandLine.arguments[1]
guard let pdf = PDFDocument(url: URL(fileURLWithPath: base + ".pdf")), let page = pdf.page(at: 0) else { fatalError("Invalid PDF") }
print("PDF pages: \(pdf.pageCount), bounds: \(page.bounds(for: .mediaBox))")
let thumb = page.thumbnail(of: NSSize(width: 1240, height: 1754), for: .mediaBox)
let bitmap = NSBitmapImageRep(data: thumb.tiffRepresentation!)!
try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "/private/tmp/railyatra-pdf-render.png"))
let detector = CIDetector(ofType: CIDetectorTypeQRCode, context: nil, options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])!
let image = CIImage(contentsOf: URL(fileURLWithPath: base + ".png"))!
let codes = detector.features(in: image).compactMap { ($0 as? CIQRCodeFeature)?.messageString }
print("Decoded QR: \(codes)")
