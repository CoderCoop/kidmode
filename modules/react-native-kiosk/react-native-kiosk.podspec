require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-kiosk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/mchelen/babymode"
  s.license      = { :type => "MIT" }
  s.authors      = { "Kid Mode" => "noreply@example.com" }
  s.platforms    = { :ios => "13.4" }
  s.source       = { :git => "https://github.com/mchelen/babymode.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.requires_arc = true
  s.swift_version = "5.0"

  # React-Core provides RCTBridgeModule / RCTEventEmitter used by Kiosk.m.
  # `install_modules_dependencies` wires up the correct React deps for both the
  # classic and new architecture without hard-coding versions.
  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end
