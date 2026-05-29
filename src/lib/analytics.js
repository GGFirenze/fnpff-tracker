export function track(eventName, properties = {}) {
  if (window.amplitude) {
    window.amplitude.track(eventName, properties)
  }
}

export function identify(userId) {
  if (window.amplitude) {
    window.amplitude.setUserId(userId)
  }
}
