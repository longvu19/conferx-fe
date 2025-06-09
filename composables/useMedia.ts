export const useGetSelectedDevices = () => {
  const getDefaultAudioInput = () => '';
  const getDefaultVideoInput = () => '';
  const getDefaultAudioOutput = () => '';

  const selectedAudioInput = useState<string>('audio-input', getDefaultAudioInput);
  const selectedVideoInput = useState<string>('video-input', getDefaultVideoInput);
  const selectedAudioOutput = useState<string>('audio-output', getDefaultAudioOutput);

  // Optionally, you can asynchronously update the state after fetching the default devices
  useDefaultMediaDevices('audioinput').then(value => selectedAudioInput.value = value);
  useDefaultMediaDevices('videoinput').then(value => selectedVideoInput.value = value);
  useDefaultMediaDevices('audiooutput').then(value => selectedAudioOutput.value = value);

  return {
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
  }
}

export const useGetAllMediaDevices : Promise<Array<{ kind: MediaDeviceKind; label: string; value: string; }>> = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const items = devices.map(device => ({
        kind: device.kind,
        label: device.label || 'Unknown Device',
        value: device.deviceId
  }))
  useState('media-devices', () : Array<{ kind: MediaDeviceKind; label: string; value: string; }> => items);
  return items;
}

export const useDefaultMediaDevices = async (type : 'audioinput' | 'videoinput' | 'audiooutput') => {
  const items = useState('media-devices', useGetAllMediaDevices);
  const filterItems = (await items.value).filter(item => item.kind === type);
  if( filterItems.length > 0 ) {
    return filterItems[0].value;
  } else {
    return '';
  }
}

export const useMediaDevices = async (cameraOn: boolean | string = true, micOn: boolean | string = true) => {
  const constrains = {
    video: typeof cameraOn === 'string' ? { deviceId: { exact: cameraOn } } : cameraOn,
    audio: typeof micOn === 'string' ? { deviceId: { exact: micOn } } : micOn
  }
  const stream = await navigator.mediaDevices
    .getUserMedia(constrains);
  if(stream) {
    return stream;
  } else {
    return false;
  }
}

export const useWatchMediaDevices = async () => { 
  const {
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
  } = useGetSelectedDevices();

  let stream = await useMediaDevices();

  watch(selectedAudioInput, async (newValue) => {
    stream = await useMediaDevices(true, newValue);
  });

  watch(selectedVideoInput, async (newValue) => {
    stream = await useMediaDevices(newValue, true);
  });

  watch(selectedAudioOutput, (newValue) => {
    console.log('Selected audio output changed:', newValue);
  });

  return stream;
}