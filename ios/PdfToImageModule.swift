import Foundation
import PDFKit
import UIKit

@objc(PdfToImage)
class PdfToImage: NSObject {

  @objc
  func convert(_ pdfPath: String, outputDir: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    do {
      let url = URL(fileURLWithPath: pdfPath)
      guard let document = PDFDocument(url: url) else {
        rejecter("PDF_ERROR", "Unable to open PDF", nil)
        return
      }

      var imagePaths: [String] = []

      for i in 0..<document.pageCount {
        guard let page = document.page(at: i) else { continue }

        let pageRect = page.bounds(for: .mediaBox)
        UIGraphicsBeginImageContext(pageRect.size)
        guard let context = UIGraphicsGetCurrentContext() else { continue }

        UIColor.white.set()
        context.fill(pageRect)
        context.saveGState()

        context.translateBy(x: 0, y: pageRect.size.height)
        context.scaleBy(x: 1, y: -1)

        page.draw(with: .mediaBox, to: context)
        context.restoreGState()

        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()

        if let img = image, let data = img.pngData() {
          let outPath = "\(outputDir)/page_\(i+1).png"
          let outUrl = URL(fileURLWithPath: outPath)
          try data.write(to: outUrl)
          imagePaths.append(outPath)
        }
      }

      resolver(imagePaths)
    } catch {
      rejecter("PDF_ERROR", "Conversion failed", error)
    }
  }
}
