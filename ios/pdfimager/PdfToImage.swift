import Foundation
import PDFKit
import UIKit

@objc(PdfToImage)
class PdfToImage: NSObject {

  @objc
  func convert(_ pdfPath: NSString, outputDir: NSString, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      let pathStr = pdfPath as String
      let url = URL(string: pathStr) ?? URL(fileURLWithPath: pathStr)
      guard let doc = PDFDocument(url: url) else {
        rejecter("PDF_ERROR", "Unable to open PDF", nil)
        return
      }

      var outPaths: [String] = []
      var errors: [String] = []

      for i in 0..<doc.pageCount {
        guard let page = doc.page(at: i) else {
          errors.append("Page \(i+1): Missing")
          continue
        }
        let pageRect = page.bounds(for: .mediaBox)
        let scale: CGFloat = UIScreen.main.scale
        let size = CGSize(width: pageRect.width * scale, height: pageRect.height * scale)

        UIGraphicsBeginImageContextWithOptions(size, true, 1.0)
        guard let context = UIGraphicsGetCurrentContext() else {
          errors.append("Page \(i+1): Context failed")
          continue
        }
        context.saveGState()
        context.translateBy(x: 0, y: size.height)
        context.scaleBy(x: 1.0, y: -1.0)
        context.scaleBy(x: scale, y: scale)
        page.draw(with: .mediaBox, to: context)
        context.restoreGState()

        guard let image = UIGraphicsGetImageFromCurrentImageContext(), let data = image.pngData() else {
          UIGraphicsEndImageContext()
          errors.append("Page \(i+1): Rendering failed")
          continue
        }
        UIGraphicsEndImageContext()

        let pdfName = URL(fileURLWithPath: pdfUri as String).lastPathComponent.replacingOccurrences(of: ".pdf", with: "", options: .caseInsensitive)
        let fileName = "\(pdfName)_page_\(i+1)_\(Int(Date().timeIntervalSince1970)).png"
        let outPath = (outputDir as String) + "/" + fileName
        let outURL = URL(fileURLWithPath: outPath)
        do {
          try data.write(to: outURL)
          outPaths.append(outURL.absoluteString) // file://...
        } catch {
          errors.append("Page \(i+1): Write failed - \(error.localizedDescription)")
        }
      }

      if outPaths.isEmpty && !errors.isEmpty {
        rejecter("PDF_CONVERSION_ERROR", "All pages failed: \(errors.joined(separator: ", "))", nil)
      } else {
        resolver(outPaths)
      }
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
