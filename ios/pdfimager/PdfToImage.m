#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PdfToImage, NSObject)
RCT_EXTERN_METHOD(convert:(NSString *)pdfPath
                  outputDir:(NSString *)outputDir
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
