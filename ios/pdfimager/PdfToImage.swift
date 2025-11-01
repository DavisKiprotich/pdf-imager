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
      for i in 0..<doc.pageCount {
        guard let page = doc.page(at: i) else { continue }
        let pageRect = page.bounds(for: .mediaBox)
        let scale: CGFloat = UIScreen.main.scale
        let size = CGSize(width: pageRect.width * scale, height: pageRect.height * scale)

        UIGraphicsBeginImageContextWithOptions(size, true, 1.0)
        guard let context = UIGraphicsGetCurrentContext() else { continue }
        context.saveGState()
        context.translateBy(x: 0, y: size.height)
        context.scaleBy(x: 1.0, y: -1.0)
        context.scaleBy(x: scale, y: scale)
        page.draw(with: .mediaBox, to: context)
        context.restoreGState()

        guard let image = UIGraphicsGetImageFromCurrentImageContext(), let data = image.pngData() else {
          UIGraphicsEndImageContext()
          continue
        }
        UIGraphicsEndImageContext()

        let fileName = "pdf_page_\(Int(Date().timeIntervalSince1970))_\(i+1).png"
        let outPath = (outputDir as String) + "/" + fileName
        let outURL = URL(fileURLWithPath: outPath)
        do {
          try data.write(to: outURL)
          outPaths.append(outURL.absoluteString) // file://...
        } catch {
          // skip page on error
        }
      }

      resolver(outPaths)
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
