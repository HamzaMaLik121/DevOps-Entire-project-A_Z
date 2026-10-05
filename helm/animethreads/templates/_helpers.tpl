{{- define "at.guard" -}}
{{- if eq .Release.Namespace "default" -}}
{{- fail "Do not install into the default namespace. Use: helm upgrade --install animethreads ./animethreads -n animethreads --create-namespace" -}}
{{- end -}}
{{- end -}}

{{- define "at.secretName" -}}
{{ default "animethreads-secrets" .Values.secrets.existingSecret }}
{{- end -}}

{{- define "at.image" -}}
{{ .root.Values.global.imageRegistry }}/animethreads-{{ .name }}{{ .suffix | default "" }}:{{ .tag | default .root.Values.global.imageTag }}
{{- end -}}

{{- define "at.selectorLabels" -}}
app.kubernetes.io/name: {{ .name }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
{{- end -}}

{{- define "at.labels" -}}
{{ include "at.selectorLabels" . }}
app.kubernetes.io/part-of: animethreads
app.kubernetes.io/managed-by: {{ .root.Release.Service }}
helm.sh/chart: {{ .root.Chart.Name }}-{{ .root.Chart.Version }}
{{- end -}}

{{/* args: root, svc, name  -> nodeSelector, tolerations, anti-affinity, topology spread */}}
{{- define "at.scheduling" -}}
{{- $sel := default .root.Values.global.nodeSelector .svc.nodeSelector -}}
{{- $tol := default .root.Values.global.tolerations .svc.tolerations -}}
{{- with $sel }}
nodeSelector:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- with $tol }}
tolerations:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- if .root.Values.global.spread }}
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          topologyKey: kubernetes.io/hostname
          labelSelector:
            matchLabels:
              {{- include "at.selectorLabels" (dict "name" .name "root" .root) | nindent 14 }}
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels:
        {{- include "at.selectorLabels" (dict "name" .name "root" .root) | nindent 8 }}
{{- end }}
{{- end -}}

{{/* args: p (probe map), port, delay */}}
{{- define "at.probe" -}}
{{- if eq .p.type "http" }}
httpGet:
  path: {{ .p.path | quote }}
  port: {{ .port }}
{{- else }}
tcpSocket:
  port: {{ .port }}
{{- end }}
initialDelaySeconds: {{ .delay }}
periodSeconds: 10
timeoutSeconds: 5
failureThreshold: 6
{{- end -}}

{{/* args: root, hosts (list of host:port) */}}
{{- define "at.waitFor" -}}
{{- range . }}
- name: wait-{{ (split ":" .)._0 }}
  image: busybox:1.36
  command: ["sh", "-c", "until nc -z {{ (split ":" .)._0 }} {{ (split ":" .)._1 }}; do echo waiting for {{ . }}; sleep 2; done"]
{{- end }}
{{- end -}}