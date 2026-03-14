import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: { releaseId: string } }
) {
  const { releaseId } = params;
  const date = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ern:NewReleaseMessage xmlns:ern="http://ddex.net/xml/ern/382"
  MessageSchemaVersionId="ern/382"
  LanguageAndScriptCode="en">
  <MessageHeader>
    <MessageId>${releaseId}</MessageId>
    <MessageSender>
      <PartyId>TrapRoyaltiesPro</PartyId>
      <PartyName><FullName>TrapRoyaltiesPro</FullName></PartyName>
    </MessageSender>
    <MessageCreatedDateTime>${date}</MessageCreatedDateTime>
  </MessageHeader>
  <ResourceList>
    <SoundRecording>
      <SoundRecordingType>MusicalWorkSoundRecording</SoundRecordingType>
      <ReleaseId>${releaseId}</ReleaseId>
    </SoundRecording>
  </ResourceList>
  <ReleaseList>
    <Release>
      <ReleaseId>${releaseId}</ReleaseId>
      <ReleaseType>Single</ReleaseType>
    </Release>
  </ReleaseList>
</ern:NewReleaseMessage>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="ddex-${releaseId}.xml"`,
    },
  });
}
