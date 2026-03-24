package com.karoti.pdfimager

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream

class PdfToImageModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "PdfToImage"
    }

    @ReactMethod
    fun convert(pdfPath: String, outputDir: String, promise: Promise) {
        try {
            val file = File(pdfPath)
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "PDF file not found at $pdfPath")
                return
            }

            val fileDescriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
            val renderer = PdfRenderer(fileDescriptor)
            val imagePaths = Arguments.createArray()

            val outDir = File(outputDir)
            if (!outDir.exists()) {
                outDir.mkdirs()
            }

            val errors = Arguments.createArray()

            for (i in 0 until renderer.pageCount) {
                try {
                    val page = renderer.openPage(i)
                    
                    // Create a bitmap with the page dimensions
                    val bitmap = Bitmap.createBitmap(page.width, page.height, Bitmap.Config.ARGB_8888)
                    val canvas = Canvas(bitmap)
                    canvas.drawColor(Color.WHITE)
                    
                    // Render the page onto the bitmap
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    
                    val pdfName = File(pdfUri).name.replace(".pdf", "", ignoreCase = true)
                    val outputFileName = "${pdfName}_page_${i + 1}_${System.currentTimeMillis()}.png"
                    val outputFile = File(outDir, outputFileName)
                    val outStream = FileOutputStream(outputFile)
                    
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, outStream)
                    outStream.flush()
                    outStream.close()
                    
                    imagePaths.pushString("file://" + outputFile.absolutePath)
                    
                    // Explicitly recycle bitmap to free memory immediately
                    bitmap.recycle()
                    page.close()
                } catch (e: Exception) {
                    errors.pushString("Page ${i + 1}: ${e.message}")
                }
            }
            
            renderer.close()
            fileDescriptor.close()
            
            if (imagePaths.size() == 0 && errors.size() > 0) {
                promise.reject("PDF_CONVERSION_ERROR", "All pages failed: " + errors.toString())
            } else {
                promise.resolve(imagePaths)
            }
        } catch (e: Exception) {
            promise.reject("PDF_CONVERSION_ERROR", e.message, e)
        }
    }
}
